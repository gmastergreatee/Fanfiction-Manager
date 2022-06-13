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
            Operations.URLBlocker.BlockURLs(e.BlockedURLs);
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
    }
}
