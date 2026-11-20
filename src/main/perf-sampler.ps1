# Coletor de contadores do Windows para o Monitor do IdleHub (GPU, disco e rede).
# Usa PdhAddEnglishCounter: os nomes em ingles funcionam em qualquer idioma do Windows.
# Imprime uma linha JSON a cada 2 s e sai sozinho quando o processo do IdleHub ($ParentPid) termina.
# Nao grava nada em disco e nao acessa a rede.

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

    [StructLayout(LayoutKind.Sequential)]
    struct Item { public IntPtr Name; public uint Status; public double Value; }

    const uint FMT_DOUBLE_NOCAP = 0x00000200 | 0x00008000;
    const uint PDH_MORE_DATA = 0x800007D2;

    static readonly string[][] Paths = {
      new[] { "gpu", @"\GPU Engine(*engtype_3D)\Utilization Percentage" },
      new[] { "diskIdle", @"\PhysicalDisk(_Total)\% Idle Time" },
      new[] { "diskBytes", @"\PhysicalDisk(_Total)\Disk Bytes/sec" },
      new[] { "netRx", @"\Network Interface(*)\Bytes Received/sec" },
      new[] { "netTx", @"\Network Interface(*)\Bytes Sent/sec" }
    };

    readonly IntPtr query;
    readonly Dictionary<string, IntPtr> counters = new Dictionary<string, IntPtr>();

    public Sampler() {
      PdhOpenQuery(null, IntPtr.Zero, out query);
      foreach (var p in Paths) {
        IntPtr h;
        if (PdhAddEnglishCounter(query, p[1], IntPtr.Zero, out h) == 0) counters[p[0]] = h;
      }
      PdhCollectQueryData(query); // taxas precisam de duas coletas
    }

    public string Next() {
      PdhCollectQueryData(query);
      var sb = new StringBuilder("{");
      bool firstKey = true;
      foreach (var kv in counters) {
        if (!firstKey) sb.Append(',');
        firstKey = false;
        sb.Append('"').Append(kv.Key).Append("\":{");
        Read(kv.Value, sb);
        sb.Append('}');
      }
      return sb.Append('}').ToString();
    }

    static void Read(IntPtr counter, StringBuilder sb) {
      uint size = 0, count;
      if (PdhGetFormattedCounterArray(counter, FMT_DOUBLE_NOCAP, ref size, out count, IntPtr.Zero) != PDH_MORE_DATA) return;
      IntPtr buffer = Marshal.AllocHGlobal((int)size);
      try {
        if (PdhGetFormattedCounterArray(counter, FMT_DOUBLE_NOCAP, ref size, out count, buffer) != 0) return;
        int stride = Marshal.SizeOf(typeof(Item));
        bool first = true;
        for (int i = 0; i < count; i++) {
          var item = (Item)Marshal.PtrToStructure(new IntPtr(buffer.ToInt64() + (long)i * stride), typeof(Item));
          if (item.Status > 1) continue; // so dados validos
          string name = Marshal.PtrToStringUni(item.Name) ?? "";
          if (!first) sb.Append(',');
          first = false;
          sb.Append('"').Append(name.Replace("\\", "\\\\").Replace("\"", "\\\"")).Append("\":")
            .Append(item.Value.ToString("R", CultureInfo.InvariantCulture));
        }
      } finally { Marshal.FreeHGlobal(buffer); }
    }
  }
}
'@

$sampler = New-Object IdleHubPerf.Sampler
while ($true) {
  Start-Sleep -Milliseconds 2000
  if (-not (Get-Process -Id $ParentPid -ErrorAction SilentlyContinue)) { exit }
  [Console]::Out.WriteLine($sampler.Next())
  [Console]::Out.Flush()
}
