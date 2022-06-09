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

        public bool IsSinglePageNovel { get { return chkSinglePageNovel.Checked; } }

        public string SinglePageURLScript { get { return txtSinglePageURLScript.Text.Trim(); } }
        public string ChapterScript { get { return txtChapterScript.Text.Trim(); } }

        public AddEditRuleUserControl(Models.SiteRule rule = null)
        {
            InitializeComponent();
            if (rule != null)
            {
                txtRuleName.Text = rule.RuleName;
                txtURLRegex.Text = rule.URLRegex;
                txtPageTypeScript.Text = rule.GetPageType_Javascript;
                txtTOCPageScript.Text = rule.GetTOC_Javascript;
                chkSinglePageNovel.Checked = rule.IsSinglePageNovel;
                txtSinglePageURLScript.Text = rule.GetSinglePageURL_Javascript;
                txtChapterScript.Text = rule.GetChapter_Javascript;
            }
        }
    }
}
