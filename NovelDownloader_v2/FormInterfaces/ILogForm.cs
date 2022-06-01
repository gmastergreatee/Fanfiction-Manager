using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NovelDownloader_v2.FormInterfaces
{
    public interface ILogForm : IForm
    {
        void AppendText(string text);
    }
}
