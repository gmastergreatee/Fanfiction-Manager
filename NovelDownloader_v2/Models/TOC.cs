using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2.Models
{
    public class TOC : TOCBase
    {
        public List<TOC_Chapter> Chapters { get; set; } = new List<TOC_Chapter>();
        public List<string> TOC_Extras { get; set; } = new List<string>();
    }
}
