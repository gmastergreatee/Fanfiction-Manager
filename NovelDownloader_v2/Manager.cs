﻿using System;
using CefSharp;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using System.Threading.Tasks;
using System.Collections.Generic;
using NovelDownloader_v2.RendererRelated.Models;

namespace NovelDownloader_v2
{
    public class Manager
    {
        NotifyIcon TrayIcon { get; set; }

        SplashForm SplashForm { get; set; }
        MainForm MainForm { get; set; }
        LogsForm LogsForm { get; set; }
        RulesForm RulesForm { get; set; }
        AddNovelForm AddNovelForm { get; set; }
        RendererRelated.RendererForm Renderer { get; set; }
        RendererRelated.RendererForm TestRenderer { get; set; }

        public Manager()
        {
#if DEBUG
            SetDummyRules();
#endif

            LogsForm = new LogsForm();

            InitializeGlobalEvents();

            SplashForm = new SplashForm();

            ShowSplash();

            var dataLoader = Task.Run(() =>
            {
                LoadRules();
                LoadNovels();
            });

            Application.DoEvents();
            dataLoader.Wait();

            InitializeForms();
            InitializeTrayIcon();
            SplashForm.Close();
            Application.DoEvents();

            ShowMainForm();
            ShowTrayContextMenu();
        }

        #region Debug Stuff

        private void SetDummyRules()
        {
            Globals.Rules = new List<Models.SiteRule>()
            {
                new Models.SiteRule
                {
                    Id = Guid.NewGuid(),
                    RuleName = "Fanfiction.net",
                    URLRegex = @"(?:https://)*(?:www|m)\.fanfiction\.net/([a-z]+)/([0-9]+)/([0-9]+)/([a-zA-Z0-9\-]+)",
                    GetPageType_Javascript = @"
if (document.querySelector('#cf-wrapper #cookie-alert'))
    return -2;
if (document.querySelector('.cf-browser-verification.cf-im-under-attack'))
    return -1;
return 0;
",
                    GetTOC_Javascript = @"
let retMe = {
    'NovelURL': window.location.href,
    'Title': '',
    'SubTitle': '',
    'Summary': '',
    'Author': '',
    'PublishedOn': '',
    'UpdatedOn': '',
    'Words': '',
    'Chapters': [],
    'ChapterCount': 0,
    'TOC_Extras': [],
};
let match = (new RegExp('(?:https://)*(?:www|m)\.fanfiction\.net/([a-z]+)/([0-9]+)/([0-9]+)/([a-zA-Z0-9\-]+)').exec(window.location.href));
if (match) {
    retMe.Title = $('#profile_top>b.xcontrast_txt').html();
    retMe.Author = $('#profile_top>a.xcontrast_txt').html();
    retMe.SubTitle = $('#pre_story_links a').last().text();
    retMe.Summary = $('#profile_top>div.xcontrast_txt').html();
    let _dat = $('#profile_top>span.xgray.xcontrast_txt').get(0).innerText.split(' - ').filter(i => i.includes(': ')).map((a) => {
        let _r = a.split(': ');
        return { 'Key': _r[0], 'Value': _r[1].replace(',', '') };
    });
    retMe.PublishedOn = _dat.find(i => i.Key == 'Published').Value;
    let up_dat = _dat.find(i => i.Key == 'Updated');
    if (up_dat)
        retMe.UpdatedOn = up_dat.Value;
    retMe.Words = _dat.find(i => i.Key == 'Words').Value;
    Array.from($(document.querySelector('#chap_select')).find('option')).forEach((el, i) => {
        retMe.Chapters.push({
            'Serial': (i + 1),
            'Name': el.innerText,
            'URL': window.location.origin + match[1] + '/' + match[2] + '/' + el.value + '/' + match[4],
        });
    });
} else {
    return null;
}
return JSON.stringify(retMe);
",
                    IsTOCPageAChapter = true,
                    IsSinglePageNovel = false,
                    GetSinglePageURL_Javascript = "",
                    GetChapter_Javascript = @"
return JSON.stringify({
    'Volume': '',
    'Name': $(document.querySelector('#chap_select')).find('option[selected]').get(0).innerText,
    'Content': $('.storytext').html(),
    'NextPageURL': '',
    'Files': [],
});
",
                    RapidDownloadTillChapter = 15,
                    RapidDownloadBufferSeconds = 2,
                    BlockedURLs = new List<string>
                    {
                        "googleads",
                        ".css",
                        ".js"
                    },
                    BlockedURLMatchingType = Models.BlockedURLMatchingTypeEnum.Contains,
                }
            };
        }

        #endregion

        public void InitializeGlobalEvents()
        {
            #region Log Stuff
            Globals.OnLog += (s, e) =>
            {
                LogText(e);
            };
            Globals.OnLogVerbose += (s, e) =>
            {
                LogText(e, true);
            };
            Globals.OnRendererEvent += (s, e) =>
            {
                LogText(RendererEvent.RendererEventLog(e), true);
            };
            Globals.OnTestRendererEvent += (s, e) =>
            {
                LogText(RendererEvent.RendererEventLog(e, true), true);
            };
            Globals.OnMsgBox += (s, e) =>
            {
                LogsForm.ShowMessageBox(e);
            };
            #endregion

            #region Show Stuff
            Globals.OnOpenRules += (s, e) =>
            {
                ShowRules();
            };
            Globals.OnOpenLogs += (s, e) =>
            {
                ShowLog();
            };
            Globals.OnOpenRenderer += (s, e) =>
            {
                ShowRenderer();
            };
            Globals.OnOpenTestRenderer += (s, e) =>
            {
                ShowTestRenderer();
            };
            Globals.OnOpenAddNovel += (s, e) =>
            {
                ShowAddNovel();
            };
            #endregion

            #region Rules Stuff
            Globals.OnAddRule += (s, e) =>
            {
                e.Id = Guid.NewGuid();
                Globals.Rules.Add(e);
                LogText("Rule \"" + e.RuleName + "\" added");
                SaveAppData();
            };
            Globals.OnUpdateRule += (s, e) =>
            {
                var rule = Globals.Rules.FirstOrDefault(i => i.Id == e.Id);
                if (rule != null)
                {
                    Models.SiteRule.Copy(e, rule);
                    LogText("Rule \"" + e.RuleName + "\" edited");
                }
                else
                {
                    LogText("Error. Maybe deleted existing rule by mistake ? No worries, added a new rule.");
                    Globals.Rules.Add(e);
                    LogText("Rule \"" + e.RuleName + "\" added");
                }
                SaveAppData();
            };
            Globals.OnDeleteRule += (s, e) =>
            {
                Globals.Rules.Remove(e);
                LogText("Rule \"" + e.RuleName + "\" deleted");
                SaveAppData();
            };
            #endregion

            Globals.OnShutDown += (s, e) =>
            {
                Shutdown();
            };
        }

        private void InitializeForms()
        {
            MainForm = new MainForm();
            Renderer = new RendererRelated.RendererForm();
            TestRenderer = new RendererRelated.RendererForm(true);
            RulesForm = new RulesForm();
            AddNovelForm = new AddNovelForm();
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

        private void ShowTestRenderer()
        {
            TestRenderer.Show();
            TestRenderer.Activate();
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

        private void ShowAddNovel()
        {
            AddNovelForm.Show();
            AddNovelForm.Activate();
        }

        private void ShowTrayContextMenu()
        {
            TrayIcon.ContextMenu = new ContextMenu(new MenuItem[]
            {
                new MenuItem("Novel Manager", (s, e) =>
                {
                    ShowMainForm();
                }),
                new MenuItem("Rules", (s, e) =>
                {
                    ShowRules();
                }),
                new MenuItem("Show Logs", (s, e) =>
                {
                    ShowLog();
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
            DataStore.Store.LoadAppData();
        }

        private void LoadNovels()
        {
            // Load existing novel data/list
        }

        private void Shutdown()
        {
            bool preventShutdown = false;
            if (!PerformPendingTasks())
            {
                MainForm.Invoke(new Action(() =>
                {
                    if (MessageBox.Show("Renderer still busy. Wanna force close?", "Really wanna quit?", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.No)
                    {
                        preventShutdown = true;
                    }
                }));
            }

            if (preventShutdown)
                return;

            TrayIcon.Dispose();
            Renderer.Operations.Browser.Dispose();
            TestRenderer.Operations.Browser.Dispose();
            Cef.Shutdown();
            Environment.Exit(0);
        }

        private void LogText(string text, bool verboseCheck = false)
        {
            if (!verboseCheck || Globals.VerboseMode)
                LogsForm.AppendText(text);
        }

        /// <summary>
        /// Returns false if renderer is busy
        /// </summary>
        /// <returns></returns>
        private bool PerformPendingTasks()
        {
            if (Renderer.IsWorking)
                return false;

            return true;
        }

        private void SaveAppData()
        {
            Task.Run(new Action(() => DataStore.Store.SaveAppData()));
        }
    }
}
