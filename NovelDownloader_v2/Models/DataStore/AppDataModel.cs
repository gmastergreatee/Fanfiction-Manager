using System;
using System.Text;
using System.Linq;
using System.Threading.Tasks;
using NovelDownloader_v2.Models;
using System.Collections.Generic;

namespace NovelDownloader_v2.Models.DataStore
{
    public class AppDataModel
    {
        public List<SiteRule> Rules { get; set; }
    }
}
