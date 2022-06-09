using CefSharp;
using CefSharp.WinForms;
using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace NovelDownloader_v2.RendererRelated
{
    public class RendererRequestHandler : CefSharp.Handler.RequestHandler
    {
        private List<string> blockStringRules { get; set; } = new List<string>();
        private bool regexMode { get; set; } = false;

        public RendererRequestHandler(List<string> blockStringRules, bool regexMode = false)
            : base()
        {
            if (blockStringRules.Count > 0)
                this.blockStringRules = blockStringRules;
            this.regexMode = regexMode;
        }

        protected override bool OnBeforeBrowse(IWebBrowser chromiumWebBrowser, IBrowser browser, IFrame frame, IRequest request, bool userGesture, bool isRedirect)
        {
            var url = request.Url;
            var block = false;
            foreach (var itm in blockStringRules)
            {
                if (regexMode)
                {
                    if (Regex.IsMatch(url, itm))
                    {
                        block = true;
                        break;
                    }
                }
                else
                {
                    if (url.StartsWith(itm))
                    {
                        block = true;
                        break;
                    }
                }
            }

            if (block)
                return true;

            if (isRedirect)
                Globals.OnRendererEvent?.Invoke(chromiumWebBrowser, new Models.RendererEvent
                {
                    Event = Models.RendererEventEnum.BrowserRedirect,
                    Details = request.Url
                });

            return base.OnBeforeBrowse(chromiumWebBrowser, browser, frame, request, userGesture, isRedirect);
        }
    }
}
