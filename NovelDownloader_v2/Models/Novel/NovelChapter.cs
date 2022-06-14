using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2.Models.Novel
{
    public class NovelChapter : ChapterBase
    {
        public List<Novel_Files> Files { get; set; } = new List<Novel_Files>();
    }
}
