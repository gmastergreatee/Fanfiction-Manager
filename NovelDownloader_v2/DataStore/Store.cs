using NovelDownloader_v2.Models.Novel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2.DataStore
{
    public class Store
    {
        public static void SaveAppData()
        {

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
