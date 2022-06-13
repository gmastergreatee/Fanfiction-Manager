using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NovelDownloader_v2.HelpUserControls
{
    public partial class ShowTestResults : UserControl
    {
        public ShowTestResults(string text = "")
        {
            InitializeComponent();
            txtData.Text = text;
        }

        private void btnCopy_Click(object sender, EventArgs e)
        {
            Clipboard.SetText(txtData.Text);
        }
    }
}
