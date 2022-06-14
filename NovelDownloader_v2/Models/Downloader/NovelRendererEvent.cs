using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2.Models.Downloader
{
    public class NovelRendererEvent
    {
        public Guid DownloadEntryGuid { get; set; }
        public string ErrorText { get; set; } = "";
        public RendererRelated.Models.RendererEvent RendererEvent { get; set; }
    }
}
