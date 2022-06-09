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
        NotifyIcon TrayIcon { get; set; }

        SplashForm SplashForm { get; set; }
        MainForm MainForm { get; set; }
        LogsForm LogsForm { get; set; }
        RulesForm RulesForm { get; set; }
        RendererRelated.RendererForm Renderer { get; set; }

        public Manager()
        {
            LogsForm = new LogsForm();

            InitializeGlobalEvents();

            SplashForm = new SplashForm();

            ShowSplash();
            Application.DoEvents();

            InitializeForms();
            InitializeTrayIcon();

            var dataLoader = Task.Run(() =>
            {
                LoadRules();
                LoadNovels();
            });

            dataLoader.Wait();
            SplashForm.Close();
            Application.DoEvents();

            ShowMainForm();
            ShowTrayContextMenu();
        }

        public void InitializeGlobalEvents()
        {
            Globals.OnLog += (s, e) =>
            {
                LogText(e);
            };
            Globals.OnLogVerbose += (s, e) =>
            {
                LogText(e, true);
            };
            Globals.OnOpenRules += (s, e) =>
            {
                ShowRules();
            };
            Globals.OnOpenLogs += (s, e) =>
            {
                ShowLog();
            };
        }

        private void InitializeForms()
        {
            MainForm = new MainForm();
            Renderer = new RendererRelated.RendererForm();
            RulesForm = new RulesForm();
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

        private void ShowRules()
        {
            RulesForm.Show();
            RulesForm.Activate();
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
            TrayIcon.Dispose();
            Cef.Shutdown();
            Environment.Exit(0);
        }

        private void LogText(string text, bool verboseCheck = false)
        {
            if (!verboseCheck || Globals.VerboseMode)
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
