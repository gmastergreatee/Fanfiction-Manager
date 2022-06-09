using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2.Models
{
    public class SiteRule
    {
        public Guid Id { get; set; }
        public string RuleName { get; set; } = "";
        public string URLRegex { get; set; } = "";
        public bool EnableJavascript { get; set; } = true;

        public string GetPageType_Javascript { get; set; } = "";
        public string GetTOC_Javascript { get; set; } = "";

        public bool IsSinglePageNovel { get; set; } = false;
        public string GetSinglePageURL_Javascript { get; set; } = "";

        public bool EnableJavascriptOnChapterPage { get; set; } = true;
        public string GetChapter_Javascript { get; set; } = "";

        public List<string> BlockedURLs { get; set; } = new List<string>();
        public BlockedURLMatchingTypeEnum BlockedURLMatchingType { get; set; } = BlockedURLMatchingTypeEnum.StartsWith;

        public int RapidDownloadTillChapter { get; set; } = 0;
        public double RapidDownloadBufferSeconds { get; set; } = 2;
    }
}
