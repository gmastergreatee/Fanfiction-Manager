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
        public string PageTypeScript { get { return txtPageTypeScript.Text.Trim(); } }
        public string TOCScript { get { return txtTOCPageScript.Text.Trim(); } }
        public bool IsTOCPageChapter { get { return chkTOCPageContainsChapter.Checked; } }

        public bool IsSinglePageNovel { get { return chkSinglePageNovel.Checked; } }

        public string SinglePageURLScript { get { return txtSinglePageURLScript.Text.Trim(); } }
        public string ChapterScript { get { return txtChapterScript.Text.Trim(); } }

        public AddEditRuleUserControl(Models.SiteRule rule = null)
        {
            InitializeComponent();
            if (rule != null)
            {
                txtRuleName.Text = rule.RuleName.Trim();
                txtURLRegex.Text = rule.URLRegex.Trim();
                txtPageTypeScript.Text = rule.GetPageType_Javascript.Trim();
                txtTOCPageScript.Text = rule.GetTOC_Javascript.Trim();
                chkTOCPageContainsChapter.Checked = rule.IsTOCPageAChapter;
                chkSinglePageNovel.Checked = rule.IsSinglePageNovel;
                txtSinglePageURLScript.Text = rule.GetSinglePageURL_Javascript.Trim();
                txtChapterScript.Text = rule.GetChapter_Javascript.Trim();
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
