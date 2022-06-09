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
    public partial class RulesForm : FormWrapper
    {
        public RulesForm()
        {
            InitializeComponent();
            Icon = Properties.Resources.AppIcon;

            listRules.Columns.AddRange(new ColumnHeader[]
            {
                new ColumnHeader()
                {
                    Name = "SN",
                    Text = "SN",
                    TextAlign = HorizontalAlignment.Right,
                },
                new ColumnHeader()
                {
                    Name = "RuleName",
                    Text = "Rule Name",
                    TextAlign = HorizontalAlignment.Left,
                },
                new ColumnHeader()
                {
                    Name = "URL",
                    Text = "URL Regex",
                    TextAlign = HorizontalAlignment.Left,
                },
            });
        }

        private void RulesForm_Load(object sender, EventArgs e)
        {

        }

        private void ResetColumnWidths()
        {
            listRules.Columns["SN"].Width = -2;
            listRules.Columns["RuleName"].Width = -2;
            listRules.Columns["URL"].Width = -2;
        }

        private void RefreshRules()
        {
            // ... get rules here and set them in the list
            ResetColumnWidths();
        }
    }
}
