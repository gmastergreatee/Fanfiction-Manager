using CefSharp;
using CefSharp.WinForms;

namespace NovelDownloader_v2.RendererRelated.Models
{
    public class URLLoadEventArgs
    {
        public IBrowser Browser { get; private set; }
        public bool CanGoBack { get; private set; }
        public bool CanGoForward { get; private set; }
        public bool IsLoading { get; private set; }
        public bool CanReload { get; private set; }
        public ChromiumWebBrowser ChromiumWebBrowser { get; private set; }

        public URLLoadEventArgs(LoadingStateChangedEventArgs e, ChromiumWebBrowser chromiumWebBrowser)
        {
            Browser = e.Browser;
            CanGoBack = e.CanGoBack;
            CanGoForward = e.CanGoForward;
            IsLoading = e.IsLoading;
            CanReload = e.CanReload;
            ChromiumWebBrowser = chromiumWebBrowser;
        }
    }
}
