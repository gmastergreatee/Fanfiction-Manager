using CefSharp;
using CefSharp.WinForms;
using System.Collections.Generic;
using System.Linq;

namespace NovelDownloader_v2.RendererRelated
{
    public class RendererLocalStorage : IRendererLocalStorage
    {
        ChromiumWebBrowser browser { get; set; }
        IRendererJavascriptExecutor javascriptExecutor { get; set; }

        public RendererLocalStorage(ChromiumWebBrowser browser, IRendererJavascriptExecutor javascriptExecutor)
        {
            this.browser = browser;
            this.javascriptExecutor = javascriptExecutor;
        }

        public Dictionary<string, string> GetAllLocalStorageVariables()
        {
            dynamic res = javascriptExecutor.RunEvaluateJavascript("{ ...localStorage };");
            Dictionary<string, string> dictRes = null;

            try
            {
                var dictTmp = new Dictionary<string, object>(res);
                dictRes = dictTmp.ToDictionary(k => k.Key, k => k.Value.ToString());
            }
            catch
            {
                return null;
            }

            return dictRes;
        }

        public string GetLocalStorageValue(string key)
        {
            return javascriptExecutor.RunEvaluateJavascriptToString($"window.localStorage.getItem('{key}');");
        }

        public void SetLocalStorageVariable(string key, string value)
        {
            javascriptExecutor.RunJavascript($"window.localStorage.setItem('{key}', '{value}');");
        }

        public void ClearLocalStorage()
        {
            javascriptExecutor.RunJavascript("window.localStorage.clear();");
        }

        public void RemoveLocalStorageKey(string key)
        {
            javascriptExecutor.RunJavascript($"window.localStorage.removeItem('{key}');");
        }
    }
}
