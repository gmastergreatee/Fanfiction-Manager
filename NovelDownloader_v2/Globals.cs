using NovelDownloader_v2.Models;
using NovelDownloader_v2.RendererRelated.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2
{
    public static class Globals
    {
        public static EventHandler<RendererEvent> OnRendererEvent;
        public static EventHandler<string> OnLog;
        public static EventHandler<string> OnLogVerbose;
        public static EventHandler OnOpenRules;
        public static EventHandler OnOpenLogs;

        public static bool VerboseMode { get; set; } = true;
        public static List<SiteRule> Rules { get; set; } = new List<SiteRule>();
    }
}
