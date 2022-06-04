using System;
using CefSharp;
using CefSharp.WinForms;
using System.Windows.Forms;
using NovelDownloader_v2.RendererRelated.REventArgs;

namespace NovelDownloader_v2.RendererRelated
{
    public partial class RendererForm : Form
    {
        #region EventHandlers
        public event EventHandler OnCloseClick;
        public event EventHandler OnBrowserDevToolsToggled;
        public event EventHandler<LoadErrorEventArgs> OnBrowserLoadError;
        public event EventHandler<URLLoadEventArgs> OnBrowserLoadingStateChanged;
        #endregion

        #region privates vars
        private ChromiumWebBrowser browser { get; set; } = null;
        #endregion

        public IRendererMethods Operations { get; private set; }

        public RendererForm()
        {
            Operations = new RendererMethods();
            browser = Operations.Browser;

            browser.Dock = DockStyle.Fill;
            browser.LoadError += browser_LoadError;
            browser.LoadingStateChanged += browser_LoadingStateChanged;

            InitializeComponent();

            tableLayoutPanel1.Controls.Add(browser, 0, 1);
            tableLayoutPanel1.SetColumnSpan(browser, 2);
        }

        #region Browser Events

        private void browser_LoadError(object sender, LoadErrorEventArgs e)
        {
            Invoke(new Action(() =>
            {
                OnBrowserLoadError?.Invoke(sender, e);
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

        private void Renderer_FormClosing(object sender, FormClosingEventArgs e)
        {
            OnCloseClick?.Invoke(sender, e);
            e.Cancel = true;
            Hide();
        }

        private void btnToggleDevTools_Click(object sender, EventArgs e)
        {
            browser.ShowDevTools();
            OnBrowserDevToolsToggled?.Invoke(sender, e);
        }
    }
}
