using System.Collections.Generic;

namespace NovelDownloader_v2.RendererRelated
{
    public interface IRendererLocalStorage
    {
        Dictionary<string, string> GetAllLocalStorageVariables();
        string GetLocalStorageValue(string key);
        void SetLocalStorageVariable(string key, string value);
        void ClearLocalStorage();
        void RemoveLocalStorageKey(string key);
    }
}
