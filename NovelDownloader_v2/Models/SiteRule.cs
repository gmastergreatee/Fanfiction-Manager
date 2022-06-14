using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace NovelDownloader_v2.Models
{
    public class SiteRule
    {
        public Guid Id { get; set; }
        public string RuleName { get; set; } = "";
        public string URLRegex { get; set; } = "";

        public string GetPageType_Javascript { get; set; } = "";
        public string GetTOC_Javascript { get; set; } = "";
        public bool IsTOCPageAChapter { get; set; } = false;

        public bool IsSinglePageNovel { get; set; } = false;
        public string GetSinglePageURL_Javascript { get; set; } = "";

        public string GetChapter_Javascript { get; set; } = "";

        public List<string> BlockedURLs { get; set; } = new List<string>();
        public BlockedURLMatchingTypeEnum BlockedURLMatchingType { get; set; } = BlockedURLMatchingTypeEnum.StartsWith;

        public int RapidDownloadTillChapter { get; set; } = 0;
        public double RapidDownloadBufferSeconds { get; set; } = 2;

        public static PageTypeEnum GetPageType(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return PageTypeEnum.UNKNOWN;

            var _tmp = text.Trim();
            switch (_tmp)
            {
                case "-2":
                    return PageTypeEnum.MANUAL_CAPTCHA;
                case "-1":
                    return PageTypeEnum.AUTO_CAPTCHA;
                case "0":
                    return PageTypeEnum.TOC;
                case "1":
                    return PageTypeEnum.CHAPTER;
                default:
                    return PageTypeEnum.UNKNOWN;
            }
        }

        public static void Copy(SiteRule copyFrom, SiteRule copyTo)
        {
            copyTo.Id = copyFrom.Id;
            copyTo.RuleName = copyFrom.RuleName;
            copyTo.URLRegex = copyFrom.URLRegex;
            copyTo.GetPageType_Javascript = copyFrom.GetPageType_Javascript;

            copyTo.GetTOC_Javascript = copyFrom.GetTOC_Javascript;
            copyTo.IsTOCPageAChapter = copyFrom.IsTOCPageAChapter;

            copyTo.IsSinglePageNovel = copyFrom.IsSinglePageNovel;
            copyTo.GetSinglePageURL_Javascript = copyFrom.GetSinglePageURL_Javascript;

            copyTo.GetChapter_Javascript = copyFrom.GetChapter_Javascript;

            copyTo.BlockedURLs = copyFrom.BlockedURLs;
            copyTo.BlockedURLMatchingType = copyFrom.BlockedURLMatchingType;

            copyTo.RapidDownloadBufferSeconds = copyFrom.RapidDownloadBufferSeconds;
            copyTo.RapidDownloadTillChapter = copyFrom.RapidDownloadTillChapter;
        }

        public static SiteRule MatchRule(string url)
        {
            return Globals.Rules.FirstOrDefault(i => new Regex(i.URLRegex).IsMatch(url));
        }
    }
}
