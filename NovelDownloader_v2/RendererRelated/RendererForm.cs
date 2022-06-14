using System;
using CefSharp;
using CefSharp.WinForms;
using System.Windows.Forms;
using NovelDownloader_v2.RendererRelated.Models;
using NovelDownloader_v2.Models;

namespace NovelDownloader_v2.RendererRelated
{
    public partial class RendererForm : FormWrapper
    {
        #region EventHandlers
        public event EventHandler OnBrowserDevToolsToggled;
        public event EventHandler<NovelDownloader_v2.Models.Downloader.NovelRendererEvent> OnNovelRendererEvent;
        #endregion

        #region privates vars
        private ChromiumWebBrowser browser { get; set; } = null;
        private TestRendererControlsForm TestRendererControlsForm { get; set; } = null;
        private bool IsTestMode { get; set; }
        #endregion

        public bool IsWorking { get; set; } = false;
        public IRendererMethods Operations { get; private set; }
        Guid DownloadEntryGuid { get; set; }

        public RendererForm(bool isTestMode = false)
        {
            IsTestMode = isTestMode;

            Operations = new RendererMethods(isTestMode);
            browser = Operations.Browser;

            browser.Dock = DockStyle.Fill;
            browser.LoadError += browser_LoadError;
            browser.FrameLoadStart += Browser_FrameLoadStart;
            browser.FrameLoadEnd += Browser_FrameLoadEnd;

            InitializeComponent();
            Icon = Properties.Resources.AppIcon;

            tableLayoutPanel1.Controls.Add(browser, 0, 1);
            tableLayoutPanel1.SetColumnSpan(browser, 2);

            if (isTestMode)
            {
                Text = "Renderer - Rule Test";
                TestRendererControlsForm = new TestRendererControlsForm(Operations);
                Globals.OnTestRendererEvent += (s, e) => SetURL(e.Url);
                Globals.OnUpdateTestRule += OnUpdateTestRule;
                Globals.OnCloseTestRenderer += OnCloseTestRenderer;
            }
            else
            {
                // ... load RendererControlsForm
                Globals.OnRendererEvent += (s, e) => SetURL(e.Url);
            }
        }

        /// <summary>
        /// Need to execute only once at startup of any Novel download
        /// </summary>
        /// <param name="downloadEntryGuid"></param>
        /// <param name="url"></param>
        public void LoadNovelUrl(Guid downloadEntryGuid, string url)
        {
            DownloadEntryGuid = downloadEntryGuid;
#if DEBUG
            Show();
            Activate();
#endif
            Operations.LoadURL(url);
        }

        private void OnCloseTestRenderer(object sender, EventArgs e)
        {
            TestRendererControlsForm.Close();
            Close();
        }

        private void OnUpdateTestRule(object sender, SiteRule e)
        {
            TestRendererControlsForm.Show();
            TestRendererControlsForm.Activate();
        }

        #region Browser Events

        private void Browser_FrameLoadEnd(object sender, FrameLoadEndEventArgs e)
        {
            if (e.Frame.IsMain)
            {
                var _event = new RendererEvent
                {
                    Event = RendererEventEnum.PageLoaded,
                    Url = e.Url,
                };
                Invoke(new Action(() =>
                {
                    (IsTestMode ? Globals.OnTestRendererEvent : Globals.OnRendererEvent)?.Invoke(sender, _event);
                    if (!IsTestMode)
                    {
                        OnNovelRendererEvent?.Invoke(sender, new NovelDownloader_v2.Models.Downloader.NovelRendererEvent()
                        {
                            DownloadEntryGuid = DownloadEntryGuid,
                            RendererEvent = _event,
                        });
                    }
                }));
            }
        }

        private void Browser_FrameLoadStart(object sender, FrameLoadStartEventArgs e)
        {
            if (e.Frame.IsMain)
            {
                var _event = new RendererEvent
                {
                    Event = (
                        e.TransitionType == TransitionType.IsRedirect || 
                        e.TransitionType == TransitionType.ClientRedirect || 
                        e.TransitionType == TransitionType.ServerRedirect
                    ) ?
                    RendererEventEnum.BrowserRedirect :
                    RendererEventEnum.PageLoading,
                    Url = e.Url,
                };

                Invoke(new Action(() =>
                {
                    (IsTestMode ? Globals.OnTestRendererEvent : Globals.OnRendererEvent)?.Invoke(sender, _event);

                    if (!IsTestMode)
                    {
                        OnNovelRendererEvent?.Invoke(sender, new NovelDownloader_v2.Models.Downloader.NovelRendererEvent()
                        {
                            DownloadEntryGuid = DownloadEntryGuid,
                            RendererEvent = _event,
                        });
                    }
                }));
            }
        }

        private void browser_LoadError(object sender, LoadErrorEventArgs e)
        {
            if (e.Frame.IsMain)
            {
                var _event = new RendererEvent
                {
                    Event = RendererEventEnum.PageLoadingStopped,
                    Url = Operations.Browser.Address + " -> " + e.ErrorText,
                };

                Invoke(new Action(() =>
                {
                    (IsTestMode ? Globals.OnTestRendererEvent : Globals.OnRendererEvent)?.Invoke(sender, _event);

                    if (!IsTestMode)
                    {
                        OnNovelRendererEvent?.Invoke(sender, new NovelDownloader_v2.Models.Downloader.NovelRendererEvent()
                        {
                            DownloadEntryGuid = DownloadEntryGuid,
                            RendererEvent = _event,
                        });
                    }
                }));
            }
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
                TestRendererControlsForm.Activate();
            }
            else
            {
                // Show RendererControlsForm
            }
        }
    }
}
