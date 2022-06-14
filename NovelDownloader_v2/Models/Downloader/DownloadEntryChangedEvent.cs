using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2.Models.Downloader
{
    public class DownloadEntryChangedEvent
    {
        public Guid GUID { get; set; }
        public string Remarks { get; set; } = "";
        public DownloadEntryChangedEnum ChangeType { get; set; }
        /// <summary>
        /// No. of chapters downloaded
        /// </summary>
        public int Downloaded { get; set; } = 0;
        /// <summary>
        /// Total no. of chapters
        /// </summary>
        public int Total { get; set; } = 0;
    }
}
