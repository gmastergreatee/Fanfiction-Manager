using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2.Models
{
    public abstract class TOCBase
    {
        public string NovelURL { get; set; } = "";
        public string Title { get; set; } = "";
        public string SubTitle { get; set; } = "";
        public string Summary { get; set; } = "";
        public string Author { get; set; } = "";
        public string PublishedOn { get; set; } = "";
        public string UpdatedOn { get; set; } = "";
        public string Words { get; set; } = "";
        public int ChapterCount { get; set; } = 0;
    }
}
