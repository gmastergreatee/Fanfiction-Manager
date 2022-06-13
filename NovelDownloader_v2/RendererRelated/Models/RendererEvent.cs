namespace NovelDownloader_v2.RendererRelated.Models
{
    public class RendererEvent
    {
        public RendererEventEnum Event { get; set; }
        public string Url { get; set; }

        public static string RendererEventLog(RendererEvent _event, bool isTestMode = false)
        {
            var log = "Renderer" + (isTestMode ? "(Rule Test)" : "") + " - ";
            switch (_event.Event)
            {
                case RendererEventEnum.BrowserRedirect:
                    log += "Redirection > " + _event.Url;
                    break;
                case RendererEventEnum.PageLoading:
                    log += "Loading > " + _event.Url;
                    break;
                case RendererEventEnum.PageLoaded:
                    log += "Loaded > " + _event.Url;
                    break;
                case RendererEventEnum.PageLoadingStopped:
                    log += "Stopped > " + _event.Url;
                    break;
                default:
                    return "";
            }
            return log;
        }

        public static string RendererEventStatus(RendererEvent _event, bool ignoreRedirects = false)
        {
            var status = "";
            if (ignoreRedirects && _event.Event == RendererEventEnum.BrowserRedirect)
            {
                return "";
            }

            switch (_event.Event)
            {
                case RendererEventEnum.PageLoading:
                    status = "Loading...";
                    break;
                case RendererEventEnum.PageLoaded:
                    status = "Loaded";
                    break;
                case RendererEventEnum.PageLoadingStopped:
                    status = "Stopped";
                    break;
                case RendererEventEnum.BrowserRedirect:
                    status = "Redirecting";
                    break;
                default:
                    break;
            }
            return status + (!string.IsNullOrWhiteSpace(_event.Url) ? " -> " + _event.Url : "");
        }
    }
}
