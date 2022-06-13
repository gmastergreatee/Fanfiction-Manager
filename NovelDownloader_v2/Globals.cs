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
        public static EventHandler<RendererEvent> OnRendererEvent { get; set; }
        public static EventHandler<RendererEvent> OnTestRendererEvent { get; set; }

        public static EventHandler<string> OnLog { get; set; }
        public static EventHandler<string> OnLogVerbose { get; set; }
        public static EventHandler OnOpenRules { get; set; }
        public static EventHandler OnOpenLogs { get; set; }
        public static EventHandler OnOpenRenderer { get; set; }
        public static EventHandler OnOpenTestRenderer { get; set; }
        public static EventHandler<SiteRule> OnUpdateTestRule { get; set; }

        public static EventHandler OnShutDown { get; set; }

        public static bool VerboseMode { get; set; } = true;
        public static List<SiteRule> Rules { get; set; } = new List<SiteRule>();
        public static SiteRule Rule { get; set; } = null;
        public static SiteRule TestRule { get; set; } = null;
    }
}
