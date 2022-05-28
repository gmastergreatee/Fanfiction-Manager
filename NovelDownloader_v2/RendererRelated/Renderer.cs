using System;
using CefSharp;
using System.Linq;
using CefSharp.WinForms;
using System.Windows.Forms;
using System.Threading.Tasks;
using System.Collections.Generic;
using NovelDownloader_v2.RendererRelated;

namespace NovelDownloader_v2.RendererRelated
{
    public partial class Renderer : Form
    {
        #region EventHandlers
        public event EventHandler OnCloseClick;
        public event EventHandler<LoadErrorEventArgs> OnBrowserLoadError;
        public event EventHandler<LoadingStateChangedEventArgs> OnBrowserLoadingStateChanged;
        #endregion

        #region privates vars
        private bool devToolsOpen = false;
        private ChromiumWebBrowser browser { get; set; } = null;
        #endregion

        public IRendererMethods Operations { get; private set; }

        public Renderer()
        {
            Operations = new RendererMethods();
            browser = Operations.Browser;

            browser.LoadError += browser_LoadError;
            browser.LoadingStateChanged += browser_LoadingStateChanged;

            InitializeComponent();

            tableLayoutPanel1.Controls.Add(browser, 0, 1);
            tableLayoutPanel1.SetColumnSpan(browser, 2);
        }
        
        #region Browser Events

        private void browser_LoadError(object sender, LoadErrorEventArgs e)
        {
            OnBrowserLoadError?.Invoke(sender, e);
        }

        private void browser_LoadingStateChanged(object sender, LoadingStateChangedEventArgs e)
        {
            OnBrowserLoadingStateChanged?.Invoke(sender, e);
        }

        #endregion

        private void Renderer_FormClosing(object sender, FormClosingEventArgs e)
        {
            OnCloseClick?.Invoke(sender, e);
            e.Cancel = true;
        }

        private void btnToggleDevTools_Click(object sender, EventArgs e)
        {
            btnToggleDevTools.Enabled = false;
            if (devToolsOpen)
            {
                browser.CloseDevTools();
                devToolsOpen = false;
            }
            else
            {
                browser.ShowDevTools();
                devToolsOpen = true;
            }
            btnToggleDevTools.Enabled = true;
        }
    }
}
