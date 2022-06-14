using System;
using System.Data;
using System.Linq;
using System.Text;
using System.Drawing;
using System.Windows.Forms;
using System.ComponentModel;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace NovelDownloader_v2
{
    public partial class AddNovelForm : FormWrapper
    {
        public AddNovelForm()
        {
            InitializeComponent();
            Icon = Properties.Resources.AppIcon;

            FormClosing += AddNovelForm_FormClosing;
        }

        private void AddNovelForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            txtURL.Clear();
            txtStatus.Text = "NA";
            txtDetails.Clear();
            picCover.Image = null;

        }

        private void btnLoadNovel_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txtURL.Text))
                return;
        }
    }
}
