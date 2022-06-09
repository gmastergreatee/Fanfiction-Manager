using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NovelDownloader_v2.HelpUserControls
{
    public partial class AddEditRuleHelpUserControl : UserControl
    {
        public AddEditRuleHelpUserControl()
        {
            InitializeComponent();
        }

        private void btnCopyTOCResponse_Click(object sender, EventArgs e)
        {
            Clipboard.SetText(lblTOCResponse.Text.Trim());
            Globals.OnLog?.Invoke(sender, "\"TOC Page Script\" JSON copied to clipboard");
        }

        private void btnCopyChapterResponse_Click(object sender, EventArgs e)
        {
            Clipboard.SetText(lblChapterResponse.Text.Trim());
            Globals.OnLog?.Invoke(sender, "\"Chapter Script\" JSON copied to clipboard");
        }
    }
}
