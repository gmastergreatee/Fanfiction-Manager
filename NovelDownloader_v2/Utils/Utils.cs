using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NovelDownloader_v2.Utils
{
    public static class Utils
    {
        public static DialogResult ShowMessage(string _text, string _caption = "Info", MessageBoxButtons buttons = MessageBoxButtons.OK, MessageBoxIcon icon = MessageBoxIcon.Information)
        {
            return MessageBox.Show(_text, _caption, buttons, icon);
        }
    }
}
