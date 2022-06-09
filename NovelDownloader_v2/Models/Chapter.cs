using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2.Models
{
    public class Chapter
    {
        public int Serial { get; set; } = 0;
        public string Name { get; set; } = "";
        public string Content { get; set; } = "";
        public string NextPageURL { get; set; } = "";
    }
}
