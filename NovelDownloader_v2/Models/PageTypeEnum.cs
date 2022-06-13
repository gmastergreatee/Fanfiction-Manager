using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2.Models
{
    public enum PageTypeEnum
    {
        UNKNOWN = -3,
        MANUAL_CAPTCHA = -2,
        AUTO_CAPTCHA = -1,
        TOC = 0,
        CHAPTER = 1,
    }
}
