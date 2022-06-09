using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NovelDownloader_v2
{
    public partial class AddEditRuleUserControl : UserControl
    {
        public string RuleName { get { return txtRuleName.Text.Trim(); } }
        public string URLRegex { get { return txtURLRegex.Text.Trim(); } }
        public bool EnableJavascript { get { return chkEnableJavascript.Checked; } }
        public string PageTypeScript { get { return txtPageTypeScript.Text.Trim(); } }
        public string TOCScript { get { return txtTOCPageScript.Text.Trim(); } }

        public bool IsSinglePageNovel { get { return chkSinglePageNovel.Checked; } }

        public string SinglePageURLScript { get { return txtSinglePageURLScript.Text.Trim(); } }
        public bool EnableChapterJavascript { get { return chkEnableChapterJavascript.Checked; } }
        public string ChapterScript { get { return txtChapterScript.Text.Trim(); } }

        public AddEditRuleUserControl(Models.SiteRule rule = null)
        {
            InitializeComponent();
            if (rule != null)
            {
                txtRuleName.Text = rule.RuleName;
                txtURLRegex.Text = rule.URLRegex;
                chkEnableJavascript.Checked = rule.EnableJavascript;
                txtPageTypeScript.Text = rule.GetPageType_Javascript;
                txtTOCPageScript.Text = rule.GetTOC_Javascript;
                chkSinglePageNovel.Checked = rule.IsSinglePageNovel;
                txtSinglePageURLScript.Text = rule.GetSinglePageURL_Javascript;
                chkEnableChapterJavascript.Checked = rule.EnableJavascriptOnChapterPage;
                txtChapterScript.Text = rule.GetChapter_Javascript;
            }
        }

        private void chkSinglePageNovel_CheckedChanged(object sender, EventArgs e)
        {
            if (chkSinglePageNovel.Checked)
            {
                lblSP_URLScript.Visible = true;
                txtSinglePageURLScript.Visible = true;
            }
            else
            {
                lblSP_URLScript.Visible = false;
                txtSinglePageURLScript.Visible = false;
                txtSinglePageURLScript.Clear();
            }
        }
    }
}
