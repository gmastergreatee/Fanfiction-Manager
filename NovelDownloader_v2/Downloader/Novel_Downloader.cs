using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NovelDownloader_v2.Models;
using System.Collections.Generic;
using NovelDownloader_v2.Models.Library;

namespace NovelDownloader_v2.Downloader
{
    public class Novel_Downloader
    {
        public event EventHandler<Models.Downloader.DownloadEntry> OnDownloadEntryChanged;

        List<RendererRelated.RendererForm> Renderers { get; set; }

        bool StopAll { get; set; } = false;

        public List<Models.Downloader.DownloadEntry> Items { get; private set; }

        List<Models.Downloader.DownloadEntry> DownloadItemBuffer { get; set; }

        public Novel_Downloader()
        {
            Items = new List<Models.Downloader.DownloadEntry>();

            Renderers = new List<RendererRelated.RendererForm>
            {
                // two renderers for now
                new RendererRelated.RendererForm(),
                new RendererRelated.RendererForm()
            };
        }

        private void Downloader_OnDownloadEntryChanged(object sender, Models.Downloader.DownloadEntryChangedEvent e)
        {
            var downloader = (Downloader)sender;
            var currentItem = DownloadItemBuffer.FirstOrDefault(i => i.GUID == e.GUID);
            switch (e.ChangeType)
            {
                case Models.Downloader.DownloadEntryChangedEnum.PROGRESS:
                    currentItem.ChaptersDownloaded = e.Downloaded;
                    currentItem.TotalChaptersToDownload = e.Total;
                    break;
                case Models.Downloader.DownloadEntryChangedEnum.STOPPED:
                    break;
                case Models.Downloader.DownloadEntryChangedEnum.COMPLETE:
                    if (DownloadItemBuffer.Remove(currentItem))
                    {
                        var processingGuids = DownloadItemBuffer.Select(i => i.GUID).ToList();
                        var nextDownload = Items.Where(i => i.Percentage < 100 && processingGuids.Contains(i.GUID) == false).OrderBy(i => i.Serial).FirstOrDefault();
                        if (nextDownload != null)
                        {
                            DownloadItemBuffer.Add(nextDownload);
                            RendererRelated.RendererForm freeRenderer = null;
                            while (freeRenderer == null)
                            {
                                freeRenderer = Renderers.FirstOrDefault(i => i.IsWorking == false);
                                if (freeRenderer == null)
                                    System.Threading.Thread.Sleep(1000);
                            }
                            downloader = new Downloader(nextDownload, freeRenderer);
                            downloader.OnDownloadEntryChanged += Downloader_OnDownloadEntryChanged;
                            //
                        }
                    }
                    else
                    {
                        Task.Run(new Action(() =>
                        {
                            System.Threading.Thread.Sleep(3000);
                            Globals.OnShutDown?.Invoke(sender, null);
                        }));
                        Globals.OnMsgBox?.Invoke(sender, "Something \"MAJOR\" went wrong in the downloader.\nPlease report the error.\nApplication state found to be unstable. Terminating app in 3 seconds.");
                    }
                    break;
                default:
                    break;
            }
        }

        public void Start()
        {
            StopAll = false;
            Task.Run(new Action(() =>
            {
                DownloadItemBuffer = Items.Take(2).ToList();
                StartDownloadingAll();
            }));
        }

        public void Stop()
        {
            StopAll = true;
        }

        private void StartDownloadingAll()
        {
            foreach (var itm in DownloadItemBuffer)
            {

            }
        }
    }
}
