using System;
using System.IO;
using System.Linq;
using System.Text;
using Newtonsoft.Json;
using System.Threading.Tasks;
using NovelDownloader_v2.Utils;
using System.Collections.Generic;
using NovelDownloader_v2.Models.Novel;
using NovelDownloader_v2.Models.DataStore;

namespace NovelDownloader_v2.DataStore
{
    public class Store
    {
        public static void SaveAppData()
        {
            if (File.Exists("LN_DbStore"))
            {
                if (File.Exists("LN_DbStore.backup"))
                    File.Delete("LN_DbStore.backup");
                File.Move("LN_DbStore", "LN_DbStore.backup");
            }

            var data = JsonConvert.SerializeObject(new AppDataModel()
            {
                Rules = Globals.Rules,
            });

            File.WriteAllBytes("LN_DbStore", ZipUnzip.Zip(data));
        }

        public static void LoadAppData()
        {
            if (File.Exists("LN_DbStore"))
            {
                var data = File.ReadAllBytes("LN_DbStore");
                var _str = ZipUnzip.UnZip(data);
                Globals.Rules = JsonConvert.DeserializeObject<AppDataModel>(_str).Rules;
                if (Globals.Rules == null)
                    Globals.Rules = new List<NovelDownloader_v2.Models.SiteRule>();
            }
        }

        public static void SaveNovelData(Novel_Data novel_data, NovelChapter_Data chapters)
        {
            throw new NotImplementedException();
        }

        public static Novel_Data GetNovelData(string filePath)
        {
            throw new NotImplementedException();
        }
    }
}
