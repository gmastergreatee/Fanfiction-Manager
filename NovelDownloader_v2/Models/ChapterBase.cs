using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2.Models
{
    public abstract class ChapterBase
    {
        public string Volume { get; set; } = "";
        public string Name { get; set; } = "";
        public string Content { get; set; } = "";
    }
}
