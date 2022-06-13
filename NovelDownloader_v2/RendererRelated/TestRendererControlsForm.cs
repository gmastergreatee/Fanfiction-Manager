using System;
using System.Data;
using System.Linq;
using System.Text;
using System.Drawing;
using System.Windows.Forms;
using System.ComponentModel;
using System.Threading.Tasks;
using System.Collections.Generic;
using NovelDownloader_v2.RendererRelated.Models;
using CefSharp;
using NovelDownloader_v2.Models;
using NovelDownloader_v2.HelpUserControls;
using Newtonsoft.Json;

namespace NovelDownloader_v2.RendererRelated
{
    public partial class TestRendererControlsForm : FormWrapper
    {
        IRendererMethods Operations { get; set; }

        public TestRendererControlsForm(IRendererMethods operations)
        {
            InitializeComponent();
            Operations = operations;

            Globals.OnTestRendererEvent += OnTestRendererEvent;
            Globals.OnUpdateTestRule += UpdateTestRule;
        }

        private void UpdateTestRule(object sender, SiteRule e)
        {
            Globals.TestRule = e;
            Globals.OnLog?.Invoke(sender, "Test-Rule updated");
            Operations.URLBlocker.BlockURLs(e.BlockedURLs);
            btnExecSPURLScript.Enabled = e.IsSinglePageNovel;
        }

        private void OnTestRendererEvent(object sender, RendererEvent e)
        {
            var status = RendererEvent.RendererEventStatus(e);
            if (e.Event == RendererEventEnum.PageLoaded)
            {
                Task.Run(new Action(() =>
                {
                    var pageType = SiteRule.GetPageType(Operations.JavascriptExecutor.RunEvaluateJavascriptToString(Globals.TestRule.GetPageType_Javascript));
                    Invoke(new Action(() =>
                    {
                        btnExecTOCScript.Enabled = pageType == PageTypeEnum.TOC;
                        btnExecSPURLScript.Enabled =
                            Globals.TestRule.IsSinglePageNovel &&
                            (pageType == PageTypeEnum.TOC || pageType == PageTypeEnum.CHAPTER);
                        btnExecChapterScript.Enabled =
                            Globals.TestRule.IsTOCPageAChapter ?
                            (pageType == PageTypeEnum.TOC || pageType == PageTypeEnum.CHAPTER)
                            :
                            pageType == PageTypeEnum.CHAPTER;
                        lblPageType.Text = pageType.ToString();
                    }));
                }));
            }

            Invoke(new Action(() =>
            {
                btnBack.Enabled = Operations.Browser.CanGoBack;
                btnForward.Enabled = Operations.Browser.CanGoForward;
                btnStop.Enabled = e.Event == RendererEventEnum.PageLoading;

                lblStatus.Text = string.IsNullOrWhiteSpace(status) ? "NA" : status;
            }));
        }

        private void btnBack_Click(object sender, EventArgs e)
        {
            if (Operations.Browser.CanGoBack)
                Operations.Browser.BrowserCore.GoBack();
        }

        private void btnForward_Click(object sender, EventArgs e)
        {
            if (Operations.Browser.CanGoForward)
                Operations.Browser.BrowserCore.GoForward();
        }

        private void btnGo_Click(object sender, EventArgs e)
        {
            Operations.Browser.Load(txtUrl.Text.Trim());
        }

        private void btnStop_Click(object sender, EventArgs e)
        {
            if (Operations.Browser.IsLoading)
                Operations.Browser.BrowserCore.StopLoad();
        }

        private void btnClearCookies_Click(object sender, EventArgs e)
        {
            Operations.ResetCookies();
        }

        private void btnClearLocalStorage_Click(object sender, EventArgs e)
        {
            Operations.LocalStorage.ClearLocalStorage();
        }

        private void btnExecTOCScript_Click(object sender, EventArgs e)
        {
            RunScript<TOC>(Globals.TestRule.GetTOC_Javascript, btnExecTOCScript);
        }

        private void btnExecSPURLScript_Click(object sender, EventArgs e)
        {
            RunScript<string>(Globals.TestRule.GetSinglePageURL_Javascript, btnExecSPURLScript);
        }

        private void btnExecChapterScript_Click(object sender, EventArgs e)
        {
            RunScript<Chapter>(Globals.TestRule.GetChapter_Javascript, btnExecChapterScript);
        }

        private void RunScript<T>(string script, Button buttonToEnable)
        {
            Task.Run(new Action(() =>
            {
                var data = Operations.JavascriptExecutor.RunEvaluateJavascriptToString(script);
                Invoke(new Action(() =>
                {
                    try
                    {
                        if (data != null)
                        {
                            if (typeof(T) != typeof(string))
                            {
                                var result = JsonConvert.DeserializeObject<T>(data);
                                new HelpForm(new ShowTestResults(JsonConvert.SerializeObject(result, Formatting.Indented)), DockStyle.Fill).ShowDialog();
                            }
                            else
                                new HelpForm(new ShowTestResults(data), DockStyle.Fill).ShowDialog();
                        }
                        else
                            MessageBox.Show("No data received", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                    catch
                    {
                        MessageBox.Show("Error while deserializing the data. Make sure you are returning a string.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                    buttonToEnable.Enabled = true;
                }));
            }));
        }
    }
}
