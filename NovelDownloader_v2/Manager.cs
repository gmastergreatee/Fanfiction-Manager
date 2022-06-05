using CefSharp;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NovelDownloader_v2
{
    public class Manager
    {
        bool VerboseMode { get; set; } = true;
        NotifyIcon TrayIcon { get; set; }

        SplashForm SplashForm { get; set; }
        MainForm MainForm { get; set; }
        LogsForm LogsForm { get; set; }
        RendererRelated.RendererForm Renderer { get; set; }

        public Manager()
        {
            InitializeForms();
            InitializeTrayIcon();

            var dataLoader = Task.Run(() =>
            {
                LoadRules();
                LoadNovels();
            });

            dataLoader.Wait();
            ShowMainForm();
            ShowTrayContextMenu();
        }

        private void InitializeForms()
        {
            SplashForm = new SplashForm();
            SplashForm.OnCloseClick += (s, e) =>
            {
                LogText("Splash window closed", true);
            };

            MainForm = new MainForm();
            MainForm.OnCloseClick += (s, e) =>
            {
                LogText("Novel-Manager window closed", true);
            };

            LogsForm = new LogsForm();
            LogsForm.OnCloseClick += (s, e) =>
            {
                LogText("Logs window closed", true);
            };

            Renderer = new RendererRelated.RendererForm();
            Renderer.OnCloseClick += (s, e) =>
            {
                LogText("Browser window closed", true);
            };
        }

        private void InitializeTrayIcon()
        {
            TrayIcon = new NotifyIcon(new System.ComponentModel.Container())
            {
                Text = "Novel Manager : Loading, please wait...",
                Icon = Properties.Resources.AppIcon
            };
            TrayIcon.Visible = true;
        }

        #region ShowStuff

        private void ShowMainForm()
        {
            MainForm.Show();
            MainForm.Activate();
        }

        private void ShowLog()
        {
            LogsForm.Show();
            LogsForm.Activate();
        }

        private void ShowRenderer()
        {
            Renderer.Show();
            Renderer.Activate();
        }

        private void ShowSplash()
        {
            SplashForm.Show();
            SplashForm.Activate();
        }

        private void ShowTrayContextMenu()
        {
            TrayIcon.ContextMenu = new ContextMenu(new MenuItem[]
            {
                new MenuItem("Novel Manager", (s, e) =>
                {
                    ShowMainForm();
                }),
                new MenuItem("Exit", (s, e) =>
                {
                    Shutdown();
                }),
            });
            TrayIcon.Text = "Novel Manager v2";

            TrayIcon.DoubleClick += (s, e) =>
            {
                MainForm.Show();
            };
        }

        #endregion

        private void LoadRules()
        {
            // Load existing novel-grabber rules
        }

        private void LoadNovels()
        {
            // Load existing novel data/list
        }

        private void Shutdown()
        {
            PerformPendingTasks();
            Cef.Shutdown();
            Environment.Exit(0);
        }

        private void LogText(string text, bool verboseCheck = false)
        {
            if (!verboseCheck || VerboseMode)
                LogsForm.AppendText(text);
        }

        private void PerformPendingTasks()
        {
            MainForm.Hide();
            Renderer.Hide();
            LogsForm.Hide();
        }
    }
}
