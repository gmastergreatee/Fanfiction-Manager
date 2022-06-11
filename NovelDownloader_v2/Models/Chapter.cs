using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace NovelDownloader_v2.Models
{
    public class Chapter
    {
        public string Volume { get; set; } = "";
        public string Name { get; set; } = "";
        public string Content { get; set; } = "";
        public string NextPageURL { get; set; } = "";
        public List<string> Files { get; set; } = new List<string>();
    }
}
