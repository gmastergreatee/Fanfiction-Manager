using CefSharp;
using NovelDownloader_v2.FormInterfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2
{
    public class Manager
    {
        MainForm MainForm { get; set; }
        ILogForm LogsForm { get; set; }
        RendererRelated.RendererForm Renderer { get; set; }

        public Manager()
        {
            MainForm = new MainForm();
            LogsForm = new LogsForm();
            Renderer = new RendererRelated.RendererForm();
        }

        private void ShowLogs()
        {
            LogsForm.Show();
        }

        private void ShowRenderer()
        {
            Renderer.Show();
        }

        private void Shutdown()
        {
            Cef.Shutdown();
            Environment.Exit(0);
        }
    }
}
