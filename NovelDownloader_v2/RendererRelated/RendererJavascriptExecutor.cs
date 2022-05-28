using CefSharp;
using CefSharp.WinForms;
using System.Threading.Tasks;

namespace NovelDownloader_v2.RendererRelated
{
    public class RendererJavascriptExecutor : IRendererJavascriptExecutor
    {
        ChromiumWebBrowser browser { get; set; }

        public RendererJavascriptExecutor(ChromiumWebBrowser browser)
        {
            this.browser = browser;
        }

        public void RunJavascript(string script)
        {
            browser.GetMainFrame().ExecuteJavaScriptAsync(script);
        }

        public dynamic RunEvaluateJavascript(string script)
        {
            string scriptTemplate = @"(function () {
                                return " + script + ";" +
                                    "})();";

            Task<JavascriptResponse> t = browser.GetMainFrame().EvaluateScriptAsync(scriptTemplate);
            t.Wait();

            return t.Result.Result;
        }

        public string RunEvaluateJavascriptToString(string script)
        {
            var res = RunEvaluateJavascript(script);
            return res?.ToString();
        }
    }
}
