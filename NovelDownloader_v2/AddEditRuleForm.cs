using NovelDownloader_v2.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NovelDownloader_v2
{
    public partial class AddEditRuleForm : Form
    {
        public SiteRule Rule { get; private set; }

        public AddEditRuleForm(SiteRule rule = null)
        {
            InitializeComponent();
            Size = new Size(880, 625);

            if (rule == null)
            {
                Text = "Add Rule";
                Rule = new SiteRule();
            }
            else
            {
                Text = "Edit Rule";
            }

            var addEditRuleUserControl = new AddEditRuleUserControl(rule)
            {
                Dock = DockStyle.Top
            };

            tabPage1.Controls.Add(addEditRuleUserControl);
        }
    }
}
