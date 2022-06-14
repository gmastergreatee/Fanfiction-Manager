using System;
using System.Linq;
using System.Text;
using Newtonsoft.Json;
using System.Windows.Forms;
using System.Threading.Tasks;
using System.Collections.Generic;
using NovelDownloader_v2.Models.Downloader;
using NovelDownloader_v2.RendererRelated.Models;

namespace NovelDownloader_v2.Downloader
{
    public class Downloader
    {
        enum PageGrabMode
        {
            TOC,
            CHAPTER,
        }

        bool manualCaptchaMode = false;

        public event EventHandler<DownloadEntryChangedEvent> OnDownloadEntryChanged;

        RendererRelated.RendererForm Renderer { get; set; }
        DownloadEntry DownloadEntry { get; set; }
        Models.SiteRule SiteRule { get; set; }
        PageGrabMode GrabMode { get; set; }

        List<Models.TOC_Chapter> ChaptersToDownload { get; set; } = new List<Models.TOC_Chapter>();
        Models.TOC TOC { get; set; }
        List<Models.Chapter> DownloadedChapters { get; set; }
        int nextChapterIndex { get; set; } = 0;
        bool stopDownload { get; set; } = false;

        public Downloader(DownloadEntry downloadEntry, RendererRelated.RendererForm renderer)
        {
            GrabMode = PageGrabMode.TOC;
            DownloadEntry = downloadEntry;
            Renderer = renderer;
            Renderer.OnNovelRendererEvent += Renderer_OnNovelRendererEvent;
        }

        private void Renderer_OnNovelRendererEvent(object sender, NovelRendererEvent e)
        {
            switch (e.RendererEvent.Event)
            {
                case RendererEventEnum.PageLoaded:
                    HandlePageLoaded(e);
                    break;
                case RendererEventEnum.PageLoadingStopped:
                    HandlePageStopped(e);
                    break;
                default:
                    break;
            }
        }

        private void HandlePageStopped(NovelRendererEvent e)
        {
            PostStopEvent("Something went wrong", e.RendererEvent.Url);
            return;
        }

        private void HandlePageLoaded(NovelRendererEvent e)
        {
            SiteRule = Models.SiteRule.MatchRule(e.RendererEvent.Url);
            if (manualCaptchaMode)
            {
                manualCaptchaMode = false;
                Renderer.Close();
            }

            if (SiteRule == null)
            {
                PostStopEvent("No matching \"Rule\" found for the URL", e.RendererEvent.Url);
                return;
            }

            var pageType = Models.SiteRule.GetPageType(
                Renderer
                .Operations
                .JavascriptExecutor
                .RunEvaluateJavascriptToString
                (
                    SiteRule.GetPageType_Javascript
                )
            );

            switch (pageType)
            {
                case Models.PageTypeEnum.MANUAL_CAPTCHA:
                    manualCaptchaMode = true;
                    Renderer.Show();
                    Renderer.Activate();
                    break;
                case Models.PageTypeEnum.AUTO_CAPTCHA:
                    // dont do anything
                    // just let it load/redirect itself
                    break;
                case Models.PageTypeEnum.TOC:
                    // can be a TOC or Chapter depending on the setting
                    // IsTOCPageAChapter
                    if (GrabMode == PageGrabMode.TOC)
                    {
                        TOC = JsonConvert.DeserializeObject<Models.TOC>(Renderer
                            .Operations
                            .JavascriptExecutor
                            .RunEvaluateJavascriptToString
                            (
                                SiteRule.GetTOC_Javascript
                            )
                        );
                        if (TOC == null)
                        {
                            PostStopEvent("TOC parse error for URL", e.RendererEvent.Url);
                            return;
                        }

                        // calculating required chapters to download
                        ChaptersToDownload = new List<Models.TOC_Chapter>();
                        if (DownloadEntry.Novel_Data.DownloadedChapterCount <= TOC.ChapterCount)
                        {
                            ChaptersToDownload = TOC.Chapters.Skip(DownloadEntry.Novel_Data.DownloadedChapterCount).ToList();
                            if (ChaptersToDownload.Count <= 0)
                            {
                                FreeRenderer();
                                OnDownloadEntryChanged?.Invoke(this, new DownloadEntryChangedEvent
                                {
                                    GUID = DownloadEntry.GUID,
                                    Remarks = $"[{DownloadEntry.Novel_Data.Title}] Already updated",
                                    ChangeType = DownloadEntryChangedEnum.COMPLETE,
                                });
                                return;
                            }
                        }

                        DownloadedChapters = new List<Models.Chapter>();

                        // changing GrabMode to Chapter
                        // for future processing
                        GrabMode = PageGrabMode.CHAPTER;

                        // Saving SinglePageURL if rule supports it
                        if (SiteRule.IsSinglePageNovel)
                        {
                            var singlePageURL = Renderer
                                .Operations
                                .JavascriptExecutor
                                .RunEvaluateJavascriptToString
                                (
                                    SiteRule.GetSinglePageURL_Javascript
                                );
                            if (singlePageURL == null)
                            {
                                PostStopEvent("SinglePageURL generation error for URL", e.RendererEvent.Url);
                                return;
                            }
                            if (!
                                (
                                    Renderer.Operations.Browser.Address.Contains(singlePageURL) ||
                                    singlePageURL.Contains(Renderer.Operations.Browser.Address)
                                )
                            )
                            {
                                Renderer.Operations.LoadURL(singlePageURL);
                            }
                            else
                            {
                                SaveChapter_And_StartLoadingNextChapter(e.RendererEvent);
                                return;
                            }
                        }

                        if (SiteRule.IsTOCPageAChapter)
                        {
                            SaveChapter_And_StartLoadingNextChapter(e.RendererEvent);
                        }
                        else
                        {
                            Renderer.Operations.LoadURL(ChaptersToDownload[nextChapterIndex++].URL);
                        }
                    }
                    else if (GrabMode == PageGrabMode.CHAPTER)
                    {
                        SaveChapter_And_StartLoadingNextChapter(e.RendererEvent);
                    }
                    break;
                case Models.PageTypeEnum.CHAPTER:
                    SaveChapter_And_StartLoadingNextChapter(e.RendererEvent);
                    break;
                default:
                    PostStopEvent("PageType cannot be determined for URL", e.RendererEvent.Url);
                    break;
            }
        }

        private void SaveChapter_And_StartLoadingNextChapter(RendererEvent rendererEvent)
        {
            if (SiteRule.IsSinglePageNovel)
            {
                throw new NotImplementedException();
                // [TODO] need to pass the indexes of the chapters to be downloaded

                var allChapters = JsonConvert.DeserializeObject<List<Models.Chapter>>(
                    Renderer
                    .Operations
                    .JavascriptExecutor
                    .RunEvaluateJavascriptToString(
                        SiteRule.GetChapter_Javascript
                    )
                );

                if (allChapters == null || allChapters.Count == 0)
                {
                    PostStopEvent("SinglePageJavascript parse error for URL", rendererEvent.Url);
                }

                DownloadedChapters = allChapters;
                DownloadEntry.Status = DownloadStatusEnum.Done;

                // .. post message

                return;
            }

            var chapter = JsonConvert.DeserializeObject<Models.Chapter>(
                Renderer
                .Operations
                .JavascriptExecutor
                .RunEvaluateJavascriptToString(
                    SiteRule.GetChapter_Javascript
                )
            );

            if (chapter == null)
            {
                var wannaSkip = Utils.Utils.ShowMessage(
                        "Chapter parse error for URL -\n\n" + rendererEvent.Url + "\n\nSkip chapter to keep downloading?",
                        "Huh?",
                        MessageBoxButtons.YesNo,
                        MessageBoxIcon.Question
                    );
                if (wannaSkip == DialogResult.No || wannaSkip == DialogResult.Cancel)
                {
                    PostStopEvent("Chapter parse error for URL", rendererEvent.Url);
                    return;
                }
            }

            DownloadedChapters.Add(chapter);

            if (ChaptersToDownload.Count > DownloadedChapters.Count)
            {
                var downloaded = DownloadedChapters.Count;
                var total = ChaptersToDownload.Count;

                // report progress
                OnDownloadEntryChanged?.Invoke(this, new DownloadEntryChangedEvent
                {
                    GUID = DownloadEntry.GUID,
                    Remarks = $"[{DownloadEntry.Novel_Data.Title}] {downloaded}/{total} chapters downloaded",
                    ChangeType = DownloadEntryChangedEnum.PROGRESS,
                    Downloaded = downloaded,
                    Total = total,
                });
                if (!stopDownload)
                {
                    // load next chapter for further processing
                    Renderer.Operations.LoadURL(ChaptersToDownload[++nextChapterIndex].URL);
                }
            }
            else
            {
                FreeRenderer();
                DownloadEntry.Status = DownloadStatusEnum.Done;
                OnDownloadEntryChanged?.Invoke(this, new DownloadEntryChangedEvent
                {
                    GUID = DownloadEntry.GUID,
                    Remarks = $"[{DownloadEntry.Novel_Data.Title}] All Downloaded",
                    ChangeType = DownloadEntryChangedEnum.COMPLETE,
                });
            }
        }

        public bool Start()
        {
            SiteRule = Models.SiteRule.MatchRule(DownloadEntry.Novel_Data.NovelURL);
            if (SiteRule == null)
                return false;
            DownloadEntry.Status = DownloadStatusEnum.Downloading;
            Task.Run(new Action(() =>
            {
                Renderer.IsWorking = true;
                Renderer.LoadNovelUrl(
                    DownloadEntry.GUID,
                    DownloadEntry.Novel_Data.NovelURL
                );
            }));
            return true;
        }

        public void Stop()
        {
            stopDownload = true;
            DownloadEntry.Status = DownloadStatusEnum.Paused;
        }

        public void Resume()
        {
            if (stopDownload)
            {
                stopDownload = false;
                DownloadEntry.Status = DownloadStatusEnum.Waiting;
                if (ChaptersToDownload.Count > DownloadedChapters.Count)
                    Renderer.Operations.LoadURL(ChaptersToDownload[++nextChapterIndex].URL);
            }
        }

        public void FreeRenderer()
        {
            Renderer.OnNovelRendererEvent -= Renderer_OnNovelRendererEvent;
            Renderer.Operations.ResetPage();
            Renderer.IsWorking = false;
        }

        private void PostStopEvent(string errorText, string url)
        {
            FreeRenderer();
            DownloadEntry.Status = DownloadStatusEnum.Error;
            Clipboard.SetText(url);
            OnDownloadEntryChanged?.Invoke(this, new DownloadEntryChangedEvent
            {
                GUID = DownloadEntry.GUID,
                Remarks = $"[{DownloadEntry.Novel_Data.Title}] {errorText} -\n\n" + url + "\n\nURL copied to clipboard",
                ChangeType = DownloadEntryChangedEnum.STOPPED,
            });
        }
    }
}
