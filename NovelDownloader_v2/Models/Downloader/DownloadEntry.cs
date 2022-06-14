using System;

namespace NovelDownloader_v2.Models.Downloader
{
    public class DownloadEntry
    {
        public int Serial { get; set; } = 0;
        public Guid GUID { get; set; } = Guid.Empty;
        public Novel.Novel_Data Novel_Data { get; set; } = null;

        public int ChaptersDownloaded { get; set; } = 0;
        public int TotalChaptersToDownload { get; set; } = 0;

        public DownloadStatusEnum Status { get; set; } = DownloadStatusEnum.Waiting;

        public decimal Percentage
        {
            get
            {
                return ((decimal)ChaptersDownloaded / (TotalChaptersToDownload == 0 ? 1 : TotalChaptersToDownload)) * 100;
            }
        }
    }
}
