using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2.Models.Novel
{
    public class NovelChapter_Data
    {
        public Guid GUID { get; set; } = Guid.NewGuid();
        public List<Novel_Chapter> Chapters { get; set; } = new List<Novel_Chapter>();
    }
}
