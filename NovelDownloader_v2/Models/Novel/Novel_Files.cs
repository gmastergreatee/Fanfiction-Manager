using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2.Models.Novel
{
    public class Novel_Files
    {
        public string Url { get; set; } = "";
        public byte[] Data { get; set; } = new byte[0];
    }
}
