using System.Collections.Generic;

namespace NovelDownloader_v2.RendererRelated
{
    public interface IRendererURLBlocker
    {
        void BlockURLs(List<string> urlsToBlock);
        void ClearBlockList();
    }
}