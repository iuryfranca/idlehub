# Coletor de contadores do Windows para o Monitor do IdleHub (GPU, disco, rede e, se pedido, processos).
# Usa PdhAddEnglishCounter: os nomes em ingles funcionam em qualquer idioma do Windows.
# Imprime uma linha JSON a cada 2 s e sai sozinho quando o processo do IdleHub ($ParentPid) termina.
# $WithProcesses = $true inclui a lista de processos da maquina. Nao grava nada em disco e nao acessa a rede.

Add-Type -Language CSharp -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Runtime.InteropServices;
using System.Text;

namespace IdleHubPerf {
  public class Sampler {
    [DllImport("pdh.dll", CharSet = CharSet.Unicode)] static extern uint PdhOpenQuery(string src, IntPtr user, out IntPtr query);
    [DllImport("pdh.dll", CharSet = CharSet.Unicode)] static extern uint PdhAddEnglishCounter(IntPtr query, string path, IntPtr user, out IntPtr counter);
    [DllImport("pdh.dll")] static extern uint PdhCollectQueryData(IntPtr query);
    [DllImport("pdh.dll", CharSet = CharSet.Unicode)] static extern uint PdhGetFormattedCounterArray(IntPtr counter, uint format, ref uint size, out uint count, IntPtr buffer);
    [DllImport("kernel32.dll")] static extern IntPtr OpenProcess(uint access, bool inherit, int pid);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern bool QueryFullProcessImageName(IntPtr process, uint flags, StringBuilder name, ref uint size);
    [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);

    [StructLayout(LayoutKind.Sequential)]
    struct Item { public IntPtr Name; public uint Status; public double Value; }

    const uint FMT_DOUBLE_NOCAP = 0x00000200 | 0x00008000;
    const uint FMT_LARGE = 0x00000400;
    const uint PDH_MORE_DATA = 0x800007D2;
    const uint PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;

    static readonly string[][] Paths = {
      new[] { "gpu", @"\GPU Engine(*engtype_3D)\Utilization Percentage" },
      new[] { "diskIdle", @"\PhysicalDisk(_Total)\% Idle Time" },
      new[] { "diskBytes", @"\PhysicalDisk(_Total)\Disk Bytes/sec" },
      new[] { "netRx", @"\Network Interface(*)\Bytes Received/sec" },
      new[] { "netTx", @"\Network Interface(*)\Bytes Sent/sec" }
    };
    static readonly string[][] ProcessPaths = {
      new[] { "pCpu", @"\Process(*)\% Processor Time" },
      new[] { "pId", @"\Process(*)\ID Process" },
      new[] { "pMem", @"\Process(*)\Working Set - Private" }
    };

    readonly IntPtr query;
    readonly Dictionary<string, IntPtr> counters = new Dictionary<string, IntPtr>();
    readonly bool withProcesses;
    Dictionary<int, string[]> info = new Dictionary<int, string[]>(); // pid -> [caminho, descricao]

    public Sampler(bool withProcesses) {
      this.withProcesses = withProcesses;
      PdhOpenQuery(null, IntPtr.Zero, out query);
      Add(Paths);
      if (withProcesses) Add(ProcessPaths);
      PdhCollectQueryData(query); // taxas precisam de duas coletas
    }

    void Add(string[][] paths) {
      foreach (var p in paths) {
        IntPtr h;
        if (PdhAddEnglishCounter(query, p[1], IntPtr.Zero, out h) == 0) counters[p[0]] = h;
      }
    }

    public string Next() {
      PdhCollectQueryData(query);
      var sb = new StringBuilder("{");
      bool firstKey = true;
      foreach (var p in Paths) {
        IntPtr h;
        if (!counters.TryGetValue(p[0], out h)) continue;
        if (!firstKey) sb.Append(',');
        firstKey = false;
        sb.Append('"').Append(p[0]).Append("\":{");
        bool first = true;
        foreach (var kv in Read(h, FMT_DOUBLE_NOCAP)) {
          if (!first) sb.Append(',');
          first = false;
          sb.Append(Json(kv.Key)).Append(':').Append(Num(kv.Value));
        }
        sb.Append('}');
      }
      if (withProcesses) AppendProcesses(sb, firstKey);
      return sb.Append('}').ToString();
    }

    // Junta os tres contadores de processo pela POSICAO: o PDH devolve varias instancias com o mesmo nome
    // (dezenas de "svchost"), mas as tres listas da mesma coleta vem na mesma ordem. O nome e conferido em cada posicao.
    void AppendProcesses(StringBuilder sb, bool firstKey) {
      IntPtr hCpu, hId, hMem;
      if (!counters.TryGetValue("pCpu", out hCpu) || !counters.TryGetValue("pId", out hId) || !counters.TryGetValue("pMem", out hMem)) return;
      var ids = Read(hId, FMT_LARGE);
      var mem = Read(hMem, FMT_LARGE);
      var cpu = Read(hCpu, FMT_DOUBLE_NOCAP);
      int cores = Environment.ProcessorCount;
      var seen = new Dictionary<int, string[]>();
      if (!firstKey) sb.Append(',');
      sb.Append("\"procs\":[");
      bool first = true;
      for (int i = 0; i < ids.Count; i++) {
        var kv = ids[i];
        if (kv.Key == "_Total" || kv.Key == "Idle") continue;
        int pid = (int)kv.Value;
        double c = i < cpu.Count && cpu[i].Key == kv.Key ? cpu[i].Value : 0;
        double m = i < mem.Count && mem[i].Key == kv.Key ? mem[i].Value : 0;
        string[] meta = Info(pid);
        seen[pid] = meta;
        string name = kv.Key;
        int hash = name.IndexOf('#');
        if (hash > 0) name = name.Substring(0, hash);
        if (!first) sb.Append(',');
        first = false;
        sb.Append("{\"n\":").Append(Json(name))
          .Append(",\"p\":").Append(pid)
          .Append(",\"c\":").Append(Num(c / cores))
          .Append(",\"m\":").Append(Num(m))
          .Append(",\"d\":").Append(Json(meta[1]))
          .Append(",\"f\":").Append(Json(meta[0])).Append('}');
      }
      sb.Append(']');
      info = seen; // descarta o cache de processos que ja terminaram
    }

    string[] Info(int pid) {
      string[] r;
      if (info.TryGetValue(pid, out r)) return r;
      r = new[] { "", "" };
      IntPtr h = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid);
      if (h != IntPtr.Zero) {
        var name = new StringBuilder(1024);
        uint size = 1024;
        if (QueryFullProcessImageName(h, 0, name, ref size)) {
          r[0] = name.ToString();
          try { r[1] = System.Diagnostics.FileVersionInfo.GetVersionInfo(r[0]).FileDescription ?? ""; } catch { }
        }
        CloseHandle(h);
      }
      return r;
    }

    static List<KeyValuePair<string, double>> Read(IntPtr counter, uint format) {
      var list = new List<KeyValuePair<string, double>>();
      uint size = 0, count;
      if (PdhGetFormattedCounterArray(counter, format, ref size, out count, IntPtr.Zero) != PDH_MORE_DATA) return list;
      IntPtr buffer = Marshal.AllocHGlobal((int)size);
      try {
        if (PdhGetFormattedCounterArray(counter, format, ref size, out count, buffer) != 0) return list;
        int stride = Marshal.SizeOf(typeof(Item));
        for (int i = 0; i < count; i++) {
          IntPtr at = new IntPtr(buffer.ToInt64() + (long)i * stride);
          var item = (Item)Marshal.PtrToStructure(at, typeof(Item));
          if (item.Status > 1) continue; // so dados validos
          // PDH_FMT_LARGE grava um inteiro de 64 bits no mesmo lugar do double
          double value = format == FMT_LARGE ? (double)Marshal.ReadInt64(at, 16) : item.Value;
          list.Add(new KeyValuePair<string, double>(Marshal.PtrToStringUni(item.Name) ?? "", value));
        }
      } finally { Marshal.FreeHGlobal(buffer); }
      return list;
    }

    static string Num(double v) { return v.ToString("R", CultureInfo.InvariantCulture); }
    static string Json(string s) {
      var sb = new StringBuilder("\"");
      foreach (char ch in s ?? "") {
        if (ch == '"' || ch == '\\') sb.Append('\\').Append(ch);
        else if (ch < 0x20) sb.Append(' ');
        else sb.Append(ch);
      }
      return sb.Append('"').ToString();
    }
  }
}
'@

$sampler = New-Object IdleHubPerf.Sampler -ArgumentList ([bool]$WithProcesses)
while ($true) {
  Start-Sleep -Milliseconds 2000
  if (-not (Get-Process -Id $ParentPid -ErrorAction SilentlyContinue)) { exit }
  [Console]::Out.WriteLine($sampler.Next())
  [Console]::Out.Flush()
}
