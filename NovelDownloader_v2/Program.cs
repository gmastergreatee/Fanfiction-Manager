using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NovelDownloader_v2
{
    static class Program
    {
        static Mutex mutex = new Mutex(true, "{8F6F0AC4-B0A1-45ad-A83F-72F04E8BDE8F}");

        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            if (mutex.WaitOne(TimeSpan.Zero, true))
            {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                NativeMethods.SetProcessDpiAwareness((int)NativeMethods.DpiAwareness.PerMonitorAware);
                var manager = new Manager();
                Application.Run();
            }
            else
            {
                NativeMethods.PostMessage((IntPtr)NativeMethods.HWND_BROADCAST, NativeMethods.WM_SHOWME, IntPtr.Zero, IntPtr.Zero);
            }
        }
    }
}
