namespace NovelDownloader_v2.RendererRelated
{
    public interface IRendererJavascriptExecutor
    {
        void RunJavascript(string script);
        dynamic RunEvaluateJavascript(string script);
        string RunEvaluateJavascriptToString(string script);
    }
}