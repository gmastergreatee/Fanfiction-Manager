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
        SplashForm SplashForm { get; set; }
        MainForm MainForm { get; set; }
        ILogForm LogsForm { get; set; }
        RendererRelated.RendererForm Renderer { get; set; }

        public Manager()
        {
            InitializeForms();
        }

        public void InitializeForms()
        {
            SplashForm = new SplashForm();
            MainForm = new MainForm();
            LogsForm = new LogsForm();
            Renderer = new RendererRelated.RendererForm();
        }

        private void ShowMainForm()
        {
            MainForm.Show();
        }

        private void ShowLog()
        {
            LogsForm.Show();
        }

        private void ShowRenderer()
        {
            Renderer.Show();
        }

        private void ShowSplash()
        {
            SplashForm.Show();
        }

        private void Shutdown()
        {
            Cef.Shutdown();
            Environment.Exit(0);
        }

        private void LogText(string text)
        {
            LogsForm.AppendText(text);
        }
    }
}
