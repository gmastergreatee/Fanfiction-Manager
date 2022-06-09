using System;
using CefSharp;
using CefSharp.WinForms;
using System.Windows.Forms;
using NovelDownloader_v2.RendererRelated.Models;

namespace NovelDownloader_v2.RendererRelated
{
    public partial class RendererForm : FormWrapper
    {
        #region EventHandlers
        public event EventHandler OnBrowserDevToolsToggled;
        public event EventHandler<URLLoadEventArgs> OnBrowserLoadingStateChanged;
        #endregion

        #region privates vars
        private ChromiumWebBrowser browser { get; set; } = null;
        private TestRendererControlsForm TestRendererControlsForm { get; set; } = null;
        private bool IsTestMode { get; set; }
        #endregion

        public bool IsWorking { get; set; } = false;
        public IRendererMethods Operations { get; private set; }

        public RendererForm(bool isTestMode = false)
        {
            IsTestMode = isTestMode;

            Operations = new RendererMethods(isTestMode);
            browser = Operations.Browser;

            browser.Dock = DockStyle.Fill;
            browser.LoadError += browser_LoadError;
            browser.LoadingStateChanged += browser_LoadingStateChanged;

            InitializeComponent();
            Icon = Properties.Resources.AppIcon;

            tableLayoutPanel1.Controls.Add(browser, 0, 1);
            tableLayoutPanel1.SetColumnSpan(browser, 2);

            if (isTestMode)
            {
                Text = "Renderer - Rule Test";
                TestRendererControlsForm = new TestRendererControlsForm(Operations);
                Globals.OnTestRendererEvent += (s, e) => SetURL(e.Url);
            }
            else
            {
                // ... load RendererControlsForm
                Globals.OnRendererEvent += (s, e) => SetURL(e.Url);
            }
        }

        #region Browser Events

        private void browser_LoadError(object sender, LoadErrorEventArgs e)
        {
            Invoke(new Action(() =>
            {
                (IsTestMode ? Globals.OnTestRendererEvent : Globals.OnRendererEvent)?.Invoke(sender, new RendererEvent()
                {
                    Event = RendererEventEnum.PageLoadingStopped,
                    Url = Operations.Browser.Address,
                });
            }));
        }

        private void browser_LoadingStateChanged(object sender, LoadingStateChangedEventArgs e)
        {
            Invoke(new Action(() =>
            {
                OnBrowserLoadingStateChanged?.Invoke(sender, new URLLoadEventArgs(e, Operations.Browser));
            }));
        }

        #endregion

        private void SetURL(string url)
        {
            Invoke(new Action(() =>
            {
                txtURL.Text = url;
            }));
        }

        private void btnToggleDevTools_Click(object sender, EventArgs e)
        {
            browser.ShowDevTools();
            OnBrowserDevToolsToggled?.Invoke(sender, e);
        }

        private void RendererForm_Load(object sender, EventArgs e)
        {
            if (IsTestMode)
            {
                TestRendererControlsForm.Show();
            }
            else
            {
                // Show RendererControlsForm
            }
        }
    }
}
